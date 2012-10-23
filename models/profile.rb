
# Profiles
# ########
#
# Profiles are customer/subscriber accounts that send money to Accounts (merchant accounts)
#
# Profiles may have many payment methods.
#
# Profiles can only send money.
#
# Profiles are editable by accounts if the account created them or if the profile joined the account.
#
# Profiles that are editable by accounts  have their profile_id in the account's profile_ids field.

require 'mongoid'
require 'bcrypt'
require 'state_machine'
require './lib/balanced'

class Profile

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps
	include BCrypt
	include BalancedAPI

	# Accessors

	attr_accessor :password

	# Data

	field :email, type: String
	field :phone, type: String, default: ''
	field :info, type: String
	field :pass_hash, type: String
	field :name, type: String
	field :state, type: String
	field :session_token, type: String
	field :account_ids, type: Array

	field :buyer_uri, type: String

	# Validations

	validates :password,
		length: {minimum: 8, on: :create}
	validates :email,
		presence: true,
		uniqueness: true,
		format: {with: /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/}
	validates :buyer_uri, # The BalancedPayments uri for the corresponding buyer account
		presence: true

  # Associations

  has_and_belongs_to_many :accounts
	has_many :subscriptions, :dependent => :destroy
	has_many :payment_methods, :dependent => :destroy
	has_many :charges
	has_many :trnsactions

  # Callbacks

  before_validation(on: :create) do
		self.password ||= rand(36**10).to_s(36) # By default, generate a random string for the pass
		# Use bcrypt to generate the pass hash/salt
		self.pass_hash = Password.create(self.password) if self.password

		self.state = 'Good'

		# Create a buyer account on balancedpayments.com
		response = BalancedAPI.create_account({
			email_address: self.email,
			name: self.name,
		})
		if response['uri']
			self.buyer_uri = response['uri']
		else # If there was an error in the balanced request, commit seppuku
			if response['description']
				errors.add('', 'Account creation error: ' + response['description'])
			else
				errors.add('', 'Account creation error :/')
			end
		end
	end

	before_validation(on: :update) do
		# Update the corresponding merchant account on balancedpayments.com
		response = BalanceAPI.update_account(self.buyer_uri, {
			email_address: self.email,
			name: self.name
		})
	end

  before_save do
		# Capitalize each word of the name
		self.name = self.name.split.each { |x| x.capitalize!}.join(' ')
  end

	after_create :generate_session_token

	def total_paid
		charges.where(state: 'Paid').map(&:amount).sum || 0
	end

	def balance
		charges.where(state: 'Pending').map(&:amount).sum || 0
	end

	def settle
		# 1. Update all the subscriptions, which may cause them to create new charges
		# 2. Find all unpaid charges and pay them all. If any payments fail, return false.
		subscriptions.all.map(&:settle)
		charges.where(state: 'Pending').map(&:pay)
	end

	def authenticate pass
		# Use bcyrpt to authenticate against our hash/salt. Returns bool.
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		# To begin a new authentication session, we generate a fresh token
		self.session_token = rand(36**16).to_s(36)
		self.save!
		return self.session_token
	end
	def destroy_session_token
		# Nullify the authentication token at the end of a session
		self.session_token = nil
		self.save!
	end

	def as_hash
		{:name => self.name,
		 :email => self.email,
		 :phone => self.phone,
		 :info => self.info || '',
		 :state => self.state,
		 :total_paid => self.total_paid,
		 :id => self.id.to_s,
		 :created_at => self.created_at.to_date.to_s,
		 :session_token => self.session_token,
		 :_subscriptions => self.subscriptions.map(&:as_hash),
		 :_charges => self.charges.map(&:as_hash),
		 :_payment_methods => self.payment_methods.map(&:as_hash)}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

end
