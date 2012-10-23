
# Charges
# ######
#
# When a charge is made, one of these tables are created.
#
# A charge may have many transactions, payments and voids.
#
# A pending charge may be canceled, in which case its state is automatically 'Voided.'
#
# A paid charge may be voided, causing a request to the payment gateway. If successful, its state becomes Voided.
#
# A charge whose transaction failed becomes Overdue.
#
# a little money
#    tiny collection of bits
#       thrown across the world

require 'mongoid'
require 'active_support/core_ext'

class Charge

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :name, type: String
	field :due, type: Date # Optional -- defaults to today.
	field :amount, type: Integer # In cents.
	field :state, type: String # Pending, Paid, Voided, Overdue
	field :pm_name, type: String # Easily accessible name of the payment method this charge is applied towards. If the associated PaymentMethod is destroyed, this name is preserved
	field :debit_uri, type: String # BalancedPayments uri for voiding

	# Validations

	validates :due, presence: true
	validates :amount,
		numericality: {greater_than: 50} # No allowed charges for less than $0.50
	validate :due_date_in_future

	# Associations

	has_many :trnsactions
	belongs_to :profile
	belongs_to :payment_method
	belongs_to :subscription
	belongs_to :account

	# Callbacks

	before_validation(on: :create) do
		self.name ||= "Charge (" + DateTime.now.to_s + ")"
		self.due ||= Date.today
		self.state = 'Pending'
		self.pm_name = self.payment_method.name
	end

	after_create do
		self.pay
	end

	def balance
		# Transactions whose amount is > 0 are payments
		self.amount - self.trnsactions.map(&:amount).sum || 0
	end

	def as_hash
		{:amount => self.amount.to_s,
		 :name => self.name,
		 :due => self.due.to_s,
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
		if self.due <= Date.today && self.state == 'Pending'
			t = self.trnsactions.create profile_id: self.profile_id
			if self.balance == 0
				self.state = 'Paid'
				self.account.credit self.amount
			else # Payment failed
				self.state = 'Overdue'
				self.profile.state = 'Overdue'
				self.profile.save!
			end
		end
	end

	def void
		if self.state == 'Paid'
			self.trnsactions.create action: 'Void', profile_id: self.profile_id
			self.state = 'Voided' if self.balance == -self.balance
		elsif self.state == 'Pending'
			self.state = 'Voided'
		end
		self.save!
	end

	private

	# Custom validation methods

	def due_date_in_future
		if self.due < Date.today
			errors.add(:due, "date can't be in the past")
		end
	end

end
