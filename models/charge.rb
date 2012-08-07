require 'mongoid'
require 'state_machine'
require 'active_support/core_ext'

class Charge

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :amount, type: Integer
	field :name, type: String
	field :due_date, type: Date
	field :state, type: String

	# Validations

	validates :amount, presence: true
	validates :name, presence: true
	validates :due_date, presence: true
	validates :amount,
		numericality: {greater_than: 0}
	validate :due_date_in_future
	validate :must_be_unpaid, :on => :update

	# Associations

	has_many :trnsactions
	belongs_to :profile
	belongs_to :payment_method
	belongs_to :plan
	belongs_to :account

	# Callbacks

	before_validation(on: :create) do
		self.name ||= "Charge (" + DateTime.now.to_s + ")"
		self.due_date ||= DateTime.now
	end

	after_create do
		self.pay_if_due
	end

	state_machine :state, initial: 'Pending' do

		# this fucking shit right here doesn't work for no goddamn reason whatsoever.
		# i'm using Charge#settle, which works fine, and which makes me question
		# why i am even using this half-assed state_machine plugin.
		event :settled do
			transition ['Pending','Overdue'] => 'Paid', if: ->(c){c.balance == 0}
		end

		event :oversettled do
			transition ['Pending','Overdue'] => 'Overpaid', if: ->(c){c.balance < 0}
		end

		event :void do
			transition 'Paid' => 'Voided', if: ->(c){c.trnsactions.create action: 'Void'}
		end

		event :past_due do
			transition 'Pending' => 'Overdue', if: ->(c){c.due_date <= DateTime.now}
		end

	end

	def settle
		self.state = 'Paid' if self.balance == 0
	end

	def balance
		self.amount - self.trnsactions.map(&:amount).sum || 0
	end

	def as_hash
		{:amount => self.amount.to_s,
		 :name => self.name,
		 :due_date => self.due_date.to_s,
		 :state => self.state,
		 :transactions => self.trnsactions.map(&:as_hash),
		 :_plan => self.plan ? self.plan.as_hash : {},
		 :id => self.id.to_s,
		 :created_at => self.created_at.strftime('%B %d, %Y %I:%M%P'),
		 :_payment_method => self.payment_method.name}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

	def pay_if_due
		if self.due_date <= Date.today && (self.state == 'Pending' || self.state == 'Overdue') && self.balance > 0
			self.trnsactions.create
			self.settle
		end
	end

	private

	# Custom validation methods

	def due_date_in_future
		if self.due_date < Date.today
			errors.add(:due_date, "date can't be in the past")
		end
	end

	def must_be_unpaid
		if self.state == 'Paid'
			errors.add(:base, "Cannot edit a charge that's already been paid")
		end
	end

end
