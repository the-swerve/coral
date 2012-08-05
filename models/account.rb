require 'mongoid'
require 'bcrypt'

class Account

	include Mongoid::Document
	include Mongoid::Timestamps
	include BCrypt

	attr_accessor :password, :email, :session_token

	# Fields

	field :email, String
	field :pass_hash, String
	field :session_token, String
	field :name, String
	field :bank_name, String

	# Validations

	validates :email,
		required: true,
		uniqueness: true,
		format: {with: /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/}
	validates :pass_hash,
		required: true
	validates :password,
		presence: {on: :create},
		length: {minimum: 8}

  # Associations

	has_many :plans, :dependent => :destroy
  has_and_belongs_to_many :profiles

  # Callbacks

  before_validation do
		self.pass_hash = Password.create(self.password) if self.password
	end

	after_create :generate_session_token

	def authenticate pass
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		self.session_token = rand(36**8).to_s(36)
		self.save
		return self.session_token
	end
	def destroy_session_token
		self.session_token = nil
		self.save
	end

	def as_hash
		{:name => self.name.to_s,
		 :email => self.email,
		 :id => self.id.to_s,
		 :bank_name => self.bank_name || 'none'}
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
