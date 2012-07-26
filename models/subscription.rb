require 'mongo_mapper'
require 'active_support/core_ext' # for date operations
require 'state_machine'

class Subscription

	include MongoMapper::Document

	key :expiration_date, Date
	key :short_id, Integer,
		:required => true
	key :state, String
	key :next_due, Date
	key :starting, Date

	timestamps!

	# Associations
	many :charges
	belongs_to :profile
	belongs_to :plan

	# Validations
	validate  :requires_payment_method
	validate  :must_not_be_overdue
	validates_presence_of :plan_id

	# Callbacks
	before_validation :defaults, :on => :create
#before_destroy :destroy_unpaid_charges

	state_machine :state, :initial => :in_trial do

		event :check_dates do
			transition :in_trial => :recurring,
				:if => lambda {|s| s.trial_end && s.trial_end <= DateTime.now}
			transition :recurring => :expired,
				:if => lambda {|s| s.expiration_date && s.expiration_date > DateTime.now}
			transition :recurring => :recurring,
				:if => lambda {|s| s.next_due <= DateTime.now}
		end

		after_transition :in_trial => :recurring do |s|
			# Make initial charge
			s.profile.charges.create(:name => "#{s.plan.name} initial charge",
				:amount => s.plan.initial_charge)
			# Make first recurring charge
			s.profile.charges.create(:name => "#{s.plan.name} recurring charge",
				:amount => s.plan.amount)
			s.next_due = s.first_due
			s.save
		end

		after_transition :recurring => :recurring do |s|
			# Continue the recurring billing cycle...
			s.profile.charges.create(:name => "#{s.plan.name} recurring charge",
				:amount => s.plan.amount)
			s.next_due = s.next_due + s.cycle_period
			s.save
		end

		state :unpaid do
		end

		state :in_trial do
		end

		state :recurring do
		end

		state :expired do
		end

	end

	def as_hash
		{:expiration_date => self.expiration_date.to_s,
		 :plan => self.plan.name,
		 :profile => self.profile.name}
	end

	def balance
		charges.where(:state => ['unpaid']).map(&:amount).sum
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

	def defaults
		self.short_id = self.profile.subscriptions.size
		self.starting ||= DateTime.now
		self.next_due ||= self.trial_end if self.plan
	end

	# Callbacks

	def destroy_unpaid_charges
		self.charges.where(:state => ['unpaid']).map(&:destroy)
		self.profile.settle
	end

	# Validations
	# We don't want to create a subscription for anyone if they have no way of paying for it
	def requires_payment_method
		if self.profile.payment_methods.empty?
			errors.add(:base, "This person must have a payment method to subscribe.")
		end
	end

	# We don't want the person to have unpaid fees before making another subscription
	def must_not_be_overdue
		if self.profile.state == 'Unpaid'
			errors.add(:base, "This person has unpaid charges.")
		end
	end

end
