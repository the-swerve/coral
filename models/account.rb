require 'mongoid'
require 'bcrypt'
require 'balanced'

class Account

	include Mongoid::Document
	include Mongoid::Timestamps
	include BCrypt

	attr_accessor :password

	# Fields

	field :name, type: String
	field :email, type: String
	field :phone_number, type: String
	field :pass_hash, type: String
	field :session_token, type: String
	field :revenue, type: Hash

	# Validations

	validates :email,
		presence: true,
		uniqueness: true,
		format: {with: /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/}
	validates :pass_hash,
		presence: true
	validates :password,
		length: {minimum: 6, on: :create}

  # Associations

	has_many :plans, :dependent => :destroy
	has_one :bank_account, :dependent => :destroy
  has_and_belongs_to_many :profiles

  # Callbacks

  before_validation do
		self.pass_hash = Password.create(self.password) if self.password

	end

	after_create :generate_session_token

	def transaction_history
		[self.profiles.reduce([]) {|ps, p| ps + p.charges.reduce([]) {|cs, c| cs + c.trnsactions.map {|t| [t.created_at.to_s, t.amount]}}}]
	end

	def authenticate pass
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		self.session_token = rand(36**8).to_s(36)
		self.save!
		puts self.attributes
		puts self.errors.to_hash
		return self.session_token
	end
	def destroy_session_token
		self.session_token = nil
		self.save
	end

	def as_hash
		{:name => self.name.to_s,
		 :email => self.email,
		 :phone_number => self.phone_number,
		 :id => self.id.to_s,
		 :session_token => self.session_token,
		 :_bank_account => self.bank_account ? self.bank_account.as_hash : {}}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

	private

# def filter_url
#   self.url = self.url.downcase.gsub(/ +/,'-').gsub(/[^a-z0-9_\-]+/i, '')
# 	self.url = self.id.to_s if self.url == ""
# end

end
