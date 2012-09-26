require 'mongoid'
require 'active_support/core_ext' # for date operations
require 'state_machine'

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
	end

	state_machine :state, :initial => 'Invited' do

		event :check_dates do
			transition 'In Trial' => 'Recurring',
				:if => lambda {|s| s.trial_end && s.trial_end <= DateTime.now}
			transition 'Recurring' => 'Expired',
				:if => lambda {|s| s.expiration_date && s.expiration_date > DateTime.now}
			transition 'Recurring' => 'Recurring',
				:if => lambda {|s| s.next_due <= DateTime.now}
		end

		after_transition 'In Trial' => 'Recurring' do |s|
			# Make initial charge
			s.profile.charges.create(:name => "Initial fee (#{s.plan.name})",
				:amount => s.plan.initial_charge,
				:plan_id => s.plan.id)
			# Make first recurring charge
			s.profile.charges.create(:name => "Recurring fee (#{s.plan.name})",
				:amount => s.plan.amount,
				:plan_id => s.plan.id)
			s.next_due = s.first_due
			s.save
		end

		after_transition 'Recurring' => 'Recurring' do |s|
			# Continue the recurring billing cycle...
			s.profile.charges.create(:name => "#{s.plan.name} recurring fee",
				:amount => s.plan.amount,
				:plan_id => s.plan.id)
			s.next_due = s.next_due + s.cycle_period
			s.save
		end

		state 'Unpaid' do
		end

		state 'In Trial' do
		end

		state 'Recurring' do
		end

		state 'Expired' do
		end

	end

	def as_hash
		{:expiration_date => self.expiration_date.to_s,
		 :created_at => self.created_at.to_date.to_s,
		 :plan_name => self.plan.name,
		 :total_paid => self.total_paid.to_s,
		 :state => self.state,
		 :id => self.id.to_s}
	end

	def balance
		charges.where(:state => 'unpaid').map(&:amount).sum
	end

	def total_paid
		charges.where(state: 'paid').map(&:amount).sum
	end

	def trial_end
		self.starting + Subscription.parse_date_interval(plan.trial_length, plan.trial_type)
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
		self.charges.where(:state => ['unpaid']).map(&:destroy)
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
