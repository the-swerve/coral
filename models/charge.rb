require 'mongoid'
require 'state_machine'
require 'active_support/core_ext'

class Charge

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :amount, Integer
	field :name, String
	field :due_date, Date
	field :state, String

	# Validations

	validates :amount, required: true
	validates :name, required: true
	validates :due_date, required: true
	validates :amount,
		numericality: {greater_than: 0}
	validate :due_date_in_future
	validate :must_be_unpaid, :on => :update

	# Associations

	has_many :trnsactions
	belongs_to :subscription
	belongs_to :profile
	belongs_to :plan
	belongs_to :account

	# Callbacks

	before_validation(on: :create) do
		self.name ||= "Charge (" + DateTime.now.to_s + ")"
		self.due_date ||= DateTime.now
	end

	state_machine :state, :initial => 'Unpaid' do

		event :pay do
			transition ['Unpaid','Overdue'] => 'Paid',
				:if => lambda {|c| c.due_date <= Date.today && c.trnsactions.create}
		end

		event :void do
			transition 'Paid' => 'Voided',
				:if => lambda {|c| c.trnsactions.create(:action => 'Void')}
		end

		event :past_due do
			transition 'Pending' => 'Overdue',
				:if => lambda {|c| c.due_date <= DateTime.now}
		end

	end

	def balance
		self.trnsactions.map(&:amount).sum || 0
	end

	def as_hash
		plan_hash = self.plan ? self.plan.as_hash : {}
		{:amount => self.amount.to_s,
		 :name => self.name,
		 :due_date => self.due_date.to_s,
		 :state => self.state,
		 :transactions => self.trnsactions.map(&:as_hash),
		 :my_profile => self.profile.as_hash,
		 :my_plan => plan_hash,
		 :id => self.id.to_s,
		 :created_at => self.created_at.to_s}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
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
