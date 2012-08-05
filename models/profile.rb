require 'mongoid'
require 'bcrypt'
require 'state_machine'

class Profile

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps
	include BCrypt

	# Accessors

	attr_accessor :email, :name, :password, :plan_id

	# Data

	field :email, type: String
	field :pass_hash, type: String
	field :name, type: String
	field :state, type: String
	field :session_token, type: String
	field :account_ids, type: Array

	# Validations

	validates :password,
		length: {minimum: 8}
	validates :email,
		presence: true,
		uniqueness: true,
		format: {with: /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/}

  # Associations

  has_and_belongs_to_many :accounts
	has_many :subscriptions, :dependent => :destroy
	has_many :payment_methods, :dependent => :destroy
	has_many :charges

  # Callbacks

  before_validation(:on => :create) do
		self.password ||= rand(36**8).to_s(36) # By default, generate a random string for the pass
	end

  before_validation do
		# Use bcrypt to generate the pass hash/salt
		self.pass_hash = Password.create(self.password) if self.password
	end

  before_save do
		# Capitalize each word of the name
		self.name = self.name.split.each { |x| x.capitalize!}.join(' ')
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
		 :_subscriptions => self.subscriptions.map(&:as_hash),
		 :_transactions => self.trnsactions.map(&:as_hash),
		 :state => self.state,
		 :id => self.id.to_s,
		 :plan_id => self.subscriptions.map {|s| s.plan.id.to_s}.first || '',
		 :_payment_methods => self.payment_methods.map(&:as_hash),
		 :created_at => self.created_at.to_date.to_s }
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
