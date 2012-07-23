require 'mongo_mapper'
require 'bcrypt'
require 'state_machine'

class Profile

	include MongoMapper::Document
	include BCrypt

	attr_accessor :email, :name, :password, :plan_short_id

	key :email, String,
		:required => true,
		:format => /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/,
		:unique => true
	key :pass_hash, String
	key :short_id, Integer,
		:required => true
	key :name, String
	key :state, String
	key :session_token, String

	validates_length_of :password, :minimum => 6, :if => :password

	timestamps!

  # Associations
  belongs_to :account

	many :subscriptions, :dependent => :destroy
	many :plans, :through => :subscriptions

	many :payment_methods, :dependent => :destroy
	many :charges
	many :trnsactions, :through => :charges

  # Callbacks
  before_validation :defaults, :on => :create
  before_validation :encrypt_pass
  before_save :capitalize_name
	after_create :add_subscription_and_payment_method

	state_machine :state, :initial => :nonsubscriber do

		event :enter_trial do
			transition any - :unpaid => :in_trial,
				:if => lambda {|p| p.subscriptions.last.state == 'in_trial'}
		end

		event :past_due do
			transition any => :unpaid,
				:if => lambda {|p| p.charges.where(:state => 'overdue').any?}
		end

		event :expire do
			transition any - :unpaid => :expired,
				:if => lambda {|p| p.subscriptions.where(:state => 'expired').any?}
		end

		event :settle do
			transition any => :paid,
				:if => lambda {|p| p.pay_all}
		end


		state :nonsubscriber do
			# No subscriptions yet
		end

		state :paid do
			# All charges paid
		end

		state :unpaid do
			# At least one unpaid/due charge
		end

		state :expired do
			# All subscriptions expired
		end

		state :in_trial do
			# All subscriptions in trial
		end
	end

	def balance
		# Get the sum of all unpaid charges
		charges.where(:state => 'unpaid').map(&:amount).sum || 0
	end

	def pay_all
		# 1. Update all the subscriptions, which may cause them to create new charges
		# 2. Find all unpaid charges and pay them all. If any payments fail, return false.
		subscriptions.all.each do |s| 
			until s.next_due > DateTime.now
				s.check_dates
			end
		end
		result = true
		charges.where(:state => 'unpaid').each do |c|
			c.pay
			result = false unless c.state == 'paid'
		end
		return result
	end

	def authenticate pass
		# Use bcyrpt to authenticate against our hash/salt. Returns bool.
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		# To begin a new authentication session, we generate a fresh token
		self.session_token = rand(36**8).to_s(36)
		self.save
		return self.session_token
	end
	def destroy_session_token
		# Nullify the authentication token at the end of a session
		self.session_token = nil
		self.save
	end

	def as_hash
		{:name => self.name,
		 :email => self.email,
		 :subscriptions => self.subscription_list,
		 :state => self.state,
		 :id => self.short_id.to_s,
		 :plan_ids => self.subscriptions.all.map {|s| s.plan.short_id}}
	end

	def subscription_list
		# Return a readable string of this person's subscription names
		if subscriptions.empty?
			'None'
		else
			subscriptions.collect {|s| s.plan.name}.join ', '
		end
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error 
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s + 
			' ' + self.errors.to_hash.first.second.first.to_s 
	end

  private

  # Callbacks
  def defaults
		self.password ||= rand(36**8).to_s(36) # By default, generate a random string for the pass
		self.short_id = self.account.profiles.size # create a nice short identifier number
		self.name ||= '' # hmm
  end

	def encrypt_pass
		# Use bcrypt to generate the pass hash/salt
		self.pass_hash = Password.create(self.password)
	end

  def capitalize_name
		self.name.split.each { |x| x.capitalize!}.join(' ')
  end

	def add_subscription_and_payment_method
		# Auto-create a dummy payment method for now
		self.payment_methods.create if self.payment_methods.all.empty?
		# If we're given a plan_short_id attribute, then let's create a
		# subscription pointing to it. This is basically simulating
		# accepts_nested_attributes in rails
		if self.plan_short_id && self.plan_short_id != ""
			found_plan = self.account.plans.first(:short_id => self.plan_short_id.to_i)
			puts 'woot'
			puts found_plan.name if found_plan
			self.subscriptions.create!(:plan_id => found_plan.id) if found_plan
			puts self.subscriptions.all.map(&:short_id)
		end
	end

end
