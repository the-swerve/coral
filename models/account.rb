
# Account
# #######
#
# Accounts can also be referred to as 'merchant accounts' and process incoming transactions.
#
# They are contrasted with Profiles, which give outgoing transactions.
#
# They have permission to edit profiles that they create or that have joined their account.
#
# sign here on the line
#   your revenue is secure
#     don't mind the fine print

require 'mongoid'
require 'bcrypt'
require './lib/balanced'

class Account

	include Mongoid::Document
	include Mongoid::Timestamps
	include BCrypt
	include BalancedAPI

	attr_accessor :password

	# Fields

	# info
	field :name, type: String
	field :address, type: String
	field :email, type: String
	field :phone_number, type: String
	field :alerts, type: Array

	# auth stuff
	field :pass_hash, type: String
	field :session_token, type: String

	# transactional stuff
	field :transferring, type: Integer # amount of money (in cents) in transfer to this merchant
	field :received, type: Integer # amount of money (in cents) received by this merchant
	field :revenue, type: Hash
	field :merchant_uri, type: String

	# Validations

	validates :email,
		presence: true,
		uniqueness: true,
		format: {with: /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/}
	validates :pass_hash,
		presence: true
	validates :password,
		length: {minimum: 6, on: :create}
	validates :merchant_uri,
		presence: true

  # Associations

	has_one :bank_account, :dependent => :destroy
  has_and_belongs_to_many :profiles

  # Callbacks

  before_validation(on: :create) do
		# Generate password hash using bcrypt
		self.pass_hash = Password.create(self.password) if self.password
		self.transferring = 0
		self.received = 0

		# Create merchant account on balancedpayments.com for payments.
		response = BalancedAPI.create_account({
			email: self.email,
			name: self.name,
			merchant: {
				type: 'person',
				name: self.name,
				dob: '1842-01',
				phone_number: '000 000 0000',
				street_address: '',
				postal_code: '',
				region: 'EX',
				country: 'USA',
			}
		})
		if response['uri']
			self.merchant_uri = response['uri']
		else # If there was an error in the balanced request, commit seppuku
			if response['description']
				errors.add('', 'Account creation error: ' + response['description'])
			else
				errors.add('', 'Account creation error :/')
			end
		end
	end

	before_save(on: :update) do
		# Update the corresponding merchant account on balancedpayments.com
		if self.name_changed?  || self.email_changed?
			response = BalancedAPI.update_account(self.merchant_uri, {
				email: self.email,
				name: self.name
			})
		end
	end

	after_create :generate_session_token

	def transaction_history
		## Create an array of [transaction date, transaction amount] for the entire account
		[self.profiles.reduce([]) {|ps, p| ps + p.charges.reduce([]) {|cs, c| cs + c.trnsactions.map {|t| [t.created_at.to_s, t.amount]}}}]
	end

	def authenticate pass
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		self.session_token = rand(36**16).to_s(36)
		self.save!
		return self.session_token
	end
	def destroy_session_token
		self.session_token = nil
		self.save!
	end

	def as_hash
		{
		 :name => self.name.to_s,
		 :email => self.email,
		 :phone_number => self.phone_number || '',
		 :address => self.address || '',
		 :transferring => self.transferring,
		 :received => self.received,
		 :id => self.id.to_s,
		 :session_token => self.session_token,
		 :_bank_account => self.bank_account ? self.bank_account.as_hash : {}
		}
	end

	def credit amount
		# Transfer 'amount' to this merchant's bank account
		self.transferring = self.transferring + amount # Amount is immediately in transfer
		# Credit the merchant account on balancedpayments.com
		response = BalancedAPI.credit_account({
			account_uri: self.merchant_uri,
			amount: amount
		})
		if response['amount']
			self.transferring = self.transferring - amount
			self.received = self.received + amount
		else
			self.alerts << 'Crediting of account failed : ' + response.to_s
		end
		self.save!
	end

	def settle
		self.profiles.all.map(&:settle)
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

end
