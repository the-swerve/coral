require 'mongoid'
require 'active_support/core_ext'

class Charge

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :amount, type: Integer # Note: this is in cents
	field :name, type: String
	field :due_date, type: Date
	field :state, type: String
	field :pm_name, type: String # Easily accessible name of the payment method this charge is applied towards. If the associated PaymentMethod is destroyed, this name is preserved
	field :debit_uri, type: String

	# Validations

	validates :amount, presence: true
	validates :due_date, presence: true
	validates :amount,
		numericality: {greater_than: 0}
	validate :due_date_in_future

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
		self.state = 'Pending'
		self.pm_name = self.payment_method.name
	end

	after_create do
		self.pay
	end

	def balance
		self.amount - self.trnsactions.map(&:amount).sum || 0
	end

	def as_hash
		{:amount => self.amount.to_s,
		 :name => self.name,
		 :due_date => self.due_date.to_s,
		 :state => self.state,
		 :id => self.id.to_s,
		 :created_at => self.created_at.strftime('%B %d, %Y %I:%M%P'),
		 :pm_name => self.pm_name || '',
		 :_transactions => self.trnsactions.map(&:as_hash),
		 :_plan => self.plan ? self.plan.as_hash : {},
		 :_payment_method => self.payment_method ? self.payment_method.name : ''}
	end
	
	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

	def pay
		if self.due_date <= Date.today && self.state == 'Pending'
			t = self.trnsactions.create profile_id: self.profile_id
			if self.balance == 0
				self.state = 'Paid'
				self.account.credit self.amount
				self.save
			end
		end
		puts 'RUNNIGN PROFILE UPDATE STATE WOOP'
		self.profile.update_state
	end

	def void
		if self.state == 'Paid'
			self.trnsactions.create action: 'Void', profile_id: self.profile_id
		elsif self.state == 'Pending'
		end
		self.state = 'Voided'
		self.save
	end

	private

	# Custom validation methods

	def due_date_in_future
		if self.due_date < Date.today
			errors.add(:due_date, "date can't be in the past")
		end
	end

end
