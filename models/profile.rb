require 'mongo_mapper'
require 'bcrypt'
require 'state_machine'

class Profile

	# Inclusions

	include MongoMapper::Document
	include BCrypt

	# Accessors

	attr_accessor :email, :name, :password, :plan_id, :invited

	# Data

	key :email, String,
		:required => true,
		:format => /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/,
		:unique => true
	key :pass_hash, String
	key :short_id, String
	key :name, String
	key :state, String
	key :session_token, String
	timestamps!

	# Validations

	validates_length_of :password, :minimum => 6, :if => :password

  # Associations

  belongs_to :account
	many :subscriptions, :dependent => :destroy
	many :plans, :through => :subscriptions
	many :payment_methods, :dependent => :destroy
	many :charges
	many :trnsactions, :through => :charges

  # Callbacks

  before_validation(:on => :create) do
		self.password ||= rand(36**8).to_s(36) # By default, generate a random string for the pass
		self.short_id = self.id
		self.name ||= '' # hmm
	end

  before_validation do
		# Use bcrypt to generate the pass hash/salt
		self.pass_hash = Password.create(self.password)
	end

  before_save do
		# Split name by spaces, capitalize each word
		self.name = self.name.split.each { |x| x.capitalize!}.join(' ')
  end

	after_create do 
		if plan_id && plan_id != ""
			found_plan = account.plans.find(self.plan_id)
			subscriptions.create!(:plan_id => found_plan.id) if found_plan
		end
	end

	# States

	state_machine :state, :initial => 'Gray' do

		event :subscribe do
			transition any - 'Gray' => 'Green',
				:if => lambda {|p| p.subscriptions.last.state == 'In trial'}
		end

		event :past_due do
			transition any => 'Red',
				:if => lambda {|p| p.charges.where(:state => 'Overdue').any?}
		end

		event :expire do
			transition any - 'Red' => 'Gray',
				:if => lambda {|p| p.subscriptions.where(:state => 'Expired').any?}
		end

		event :settle do
			transition any => 'Green',
				:if => lambda {|p| p.pay_all}
		end


		state 'Gray' do
			# Non-subscriber and/or no payment method
		end

		state 'Green' do
			# Subscriber with payment method and no failed transactions
		end

		state 'Red' do
			# At least one unpaid/due charge (from a failed transaction)
		end

	end

	def balance
		# Get the sum of all unpaid charges
		charges.where(:state => 'Unpaid').map(&:amount).sum || 0
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
		charges.where(:state => 'Unpaid').each do |c|
			c.pay
			result = false unless c.state == 'Paid'
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
		 :_subscriptions => self.subscriptions.map {|s| s.plan.name},
		 :state => self.state,
		 :id => self.id.to_s,
		 :plan_id => self.subscriptions.all.map {|s| s.plan.id.to_s}.first || '',
		 :_payment_methods => self.payment_methods.all.map(&:as_hash),
		 :created_at => self.created_at.to_date.to_s,
		 :total_paid => self.total_paid.to_s}
	end

	def total_paid
		charges.where(:state => 'Paid').map(&:amount).sum || 0
	end

	def subscription_list
		# Return a readable string of this person's subscription names
		if subscriptions.empty?
			'none'
		else
			subscriptions.collect {|s| s.plan.name + ' &#x2012; <em>' + s.state + '</em>'}.join ', '
		end
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

end
