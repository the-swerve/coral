require 'mongo_mapper'
require 'bcrypt'

class Account

	include MongoMapper::Document
	include BCrypt

	attr_accessor :password, :email, :session_token

	key :email, String,
		:required => true,
		:unique => true,
		:format => /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/

	key :pass_hash, String,
		:required => true

	key :session_token, String

	key :name, String

	validates_presence_of :password, :on => :create
	validates_length_of :password, :minimum => 6, :if => :password

	timestamps!
  
  # Associations
	many :plans, :dependent => :destroy
  many :profiles, :dependent => :destroy
  many :trnsactions, :dependent => :destroy

  # Callbacks
  before_validation :defaults, :on => :create
  before_validation :encrypt_pass
# before_save :filter_url

  # Simply removes all non-alphanumerics 
  def defaults
  end

	def encrypt_pass
		self.pass_hash = Password.create(self.password) if self.password
	end

	def authenticate pass
		Password.new(self.pass_hash) == pass
	end

	def generate_session_token
		self.session_token = rand(36**8).to_s(36)
		self.save!
		return self.session_token
	end
	def destroy_session_token
		self.session_token = nil
		self.save
	end

	def as_hash
		{:name => self.name.to_s,
		 :email => self.email}
#	 :plans => self.plans.map(&:as_hash)}
	end

	private

# def filter_url
#   self.url = self.url.downcase.gsub(/ +/,'-').gsub(/[^a-z0-9_\-]+/i, '')
# 	self.url = self.id.to_s if self.url == ""
# end

end
