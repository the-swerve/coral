
# Subscriptions
# #############
#
# These represent recurring payments. They're nested under the payment methods for profiles.
#
# The simplest way to create these is to give an amount. It will then charge
# that amount per month starting that day indefinately.
#
# The user may provide an expiration, a specific starting date, and an extra initial fee.
#
# Subscription.settle will check if any charges are due and create them. It needs to be run regularly.
#
# the moon pulls the tides
#   so too the payment cycle
#     the endless exchange

require 'mongoid'
require 'active_support/core_ext' # for date operations

class Subscription

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :name, type: String
	field :state, type: String # Invited, Recurring, Overdue, or Expired
	field :next_due, type: Date # A convenience field that stores when the next charge will be placed.

	# Transactional fields

	field :amount, type: Integer # In cents.
	field :initial_charge, type: Integer # In cents.
	field :starting, type: Date # Date the subscription goes in effect and charges are made.
	field :expiration, type: Date # Date the suscription goes out of effect and no more charges are made.

	# Validations

	validate  :must_not_be_overdue # Profile must not have overdue charges
	validates :amount,
		numericality: {greater_than: 50} # No allowed charges for less than $0.50
	validates :payment_method, presence: true
	validates :starting, presence: true
	validates :name, presence: true

	# Associations

	belongs_to :payment_method
	belongs_to :profile
	has_many :charges

	# Callbacks

	before_validation(:on => :create) do
		self.state = 'Invited'
		self.starting ||= Date.today # Default the starting date to today if it's not provided.
		self.next_due = self.starting
	end

	after_create do
		self.settle
	end

	before_destroy do
		self.destroy_unpaid_charges
	end

	def settle
		if self.state == 'Invited' && self.starting <= Date.today
			# Starting date was given and there's a payment method. Activate!
			self.state = 'Recurring'
			self.create_initial_charges
		elsif self.state == 'Recurring' && self.next_due <= Date.today
			# Make recurring charge
			self.profile.charges.create(:name => "Recurring fee (#{self.name})",
				amount: self.amount,
				subscription_id: self.id,
				account_id: self.account.id,
				payment_method_id: self.payment_method.id)
			self.next_due = self.next_due + 1.month
		end
		self.save!
	end

	def create_initial_charges
		# Make initial charge
		self.profile.charges.create(:name => "Initial fee (#{self.name})",
			amount: self.initial_charge,
			subscription_id: self.id,
			account_id: self.account.id,
			payment_method_id: self.payment_method.id)
		# Make first recurring charge
		self.profile.charges.create(:name => "Recurring fee (#{self.name})",
			amount: self.amount,
			subscription_id: self.id,
			account_id: self.account.id,
			payment_method_id: self.payment_method.id)
		self.next_due = self.first_due
	end

	def as_hash
		{:expiration_date => self.expiration_date.to_s,
		 :created_at => self.created_at.to_date.to_s,
		 :plan_name => self.name,
		 :plan_amount => self.amount,
		 :plan_cycle => self.cycle_length.to_s + ' ' + self.cycle_type,
		 :total_paid => self.total_paid.to_s,
		 :state => self.state,
		 :id => self.id.to_s}
	end

	def balance
		charges.where(state: 'Pending').map(&:amount).sum
	end

	def total_paid
		charges.where(state: 'Paid').map(&:amount).sum
	end

	def first_due
		# Monthly subscriptions created 28-31st will have a paydate of the 1st
		if self.starting.day > 28
	     # Because of shorter months, cycles on the 28-31st will be inconsistent
	     # (For example, when we add 1.month to a date on the 31st in ruby, it
	     # will turn into the 30th since the next month has only 30 days) So to
	     # get consistent pay dates for monthly cycles with those dates, we simply
			 # make the pay date the 1st.  We do this by incrementing the starting
			 # date 2 months, then changing the day to 1.
			 # We could also just disallow dates > 28. lol.
			(self.starting + 2.months).change(:day => 1)
		else
			cycle_period.from_now
		end
	end

	private

	# Callbacks

	def destroy_unpaid_charges
		self.charges.where(state: 'Pending').map(&:destroy)
	end

	# We don't want the person to have unpaid fees before making another subscription
	def must_not_be_overdue
		if self.profile.state == 'Overdue'
			errors.add(:base, "This person has overdue charges.")
		end
	end

end
