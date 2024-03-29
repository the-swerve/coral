require 'mongoid'
require 'active_support/core_ext' # for date operations

class Subscription

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :expiration_date, type: Date
	field :short_id, type: String
	field :state, type: String
	field :next_due, type: Date
	field :starting, type: Date

	# Associations

	has_many :charges
	belongs_to :profile
	has_one :payment_method
	belongs_to :plan

	# Validations

	validate  :must_not_be_overdue
	validate :valid_plan_id

	# Callbacks

	before_validation(:on => :create) do
		self.short_id = self.id
		self.state = 'Invited'
	end

	before_save do
		puts 'in after_create, before conditional'
		if self.payment_method
			puts 'has pm'
		end
		if self.starting
			puts 'has starting'
		end
		if self.payment_method && self.starting && self.starting <= Date.today
			puts 'in before_save, inside conditional'
			# Starting date was given and there's a payment method. Activate!
			self.state = 'Recurring'
			self.create_initial_charges
		end
	end

	def create_initial_charges
		# Make initial charge
		self.profile.charges.create(:name => "Initial fee (#{self.plan.name})",
			amount: self.plan.initial_charge,
			plan_id: self.plan.id,
			account_id: self.plan.account.id,
			payment_method_id: self.payment_method.id)
		# Make first recurring charge
		self.profile.charges.create(:name => "Recurring fee (#{self.plan.name})",
			amount: self.plan.amount,
			plan_id: self.plan.id,
			account_id: self.plan.account.id,
			payment_method_id: self.payment_method.id)
		self.next_due = self.first_due
	end

	def as_hash
		{:expiration_date => self.expiration_date.to_s,
		 :created_at => self.created_at.to_date.to_s,
		 :plan_name => self.plan.name,
		 :plan_amount => self.plan.amount,
		 :plan_cycle => self.plan.cycle_length.to_s + ' ' + self.plan.cycle_type,
		 :total_paid => self.total_paid.to_s,
		 :state => self.state,
		 :id => self.id.to_s}
	end

	def balance
		charges.where(:state => 'Pending').map(&:amount).sum
	end

	def total_paid
		charges.where(state: 'Paid').map(&:amount).sum
	end

	def cycle_period
		Subscription.parse_date_interval(plan.cycle_length, plan.cycle_type)
	end

	def Subscription.parse_date_interval(length, type)
		case type
		when /days?/; length.days
		when /weeks?/; length.weeks
		when /months?/; length.months
		when /years?/; length.years
		else; 0; end
	end

	def first_due
		# Monthly subscriptions created 28-31st will have a paydate of the 1st
		if plan.cycle_type == 'month' && self.created_at.day > 28
	     # Because of shorter months, cycles on the 28-31st will be inconsistent
	     # (For example, when we add 1.month to a date on the 31st in ruby, it
	     # will turn into the 30th since the next month has only 30 days) So to
	     # get consistent pay dates for monthly cycles with those dates, we simply
	     # make the pay date the 1st.  We do this by incrementing the date 1
	     # cycle, then incrementing one more month, then changing the day to 1.
			(cycle_period + 1.month).from_now.change(:day => 1)
		else
			cycle_period.from_now
		end
	end

	private

	# Callbacks

	def destroy_unpaid_charges
		self.charges.where(:state => ['Pending']).map(&:destroy)
		self.profile.settle
	end

	# We don't want the person to have unpaid fees before making another subscription
	def must_not_be_overdue
		if self.profile.state == 'Overdue'
			errors.add(:base, "This person has unpaid charges.")
		end
	end

	def valid_plan_id
		p = Plan.find(self.plan_id) if self.plan_id
		errors.add('', 'plan not chosen for subscription') if !p || !self.plan_id
	end

end
