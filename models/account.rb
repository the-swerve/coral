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

	key :short_id, String

	validates_presence_of :password, :on => :create
	validates_length_of :password, :minimum => 6, :if => :password

	timestamps!

  # Associations
	many :plans, :dependent => :destroy
  many :profiles, :dependent => :destroy
	many :charges, :through => :profiles

  # Callbacks
  before_validation :defaults, :on => :create
  before_validation :encrypt_pass
	after_create :generate_session_token
# before_save :filter_url

	def charting_data
		{:signups => self.signups_six_months} #, :revenue => self.revenue_six_months}
	end

	# Return the signups over the last six months
	def signups_six_months
		# all profiles created less than six months ago (the date is greater than the six-months-ago date).
		data = self.profiles.filter {|p| p.created_at > 6.months.ago}.map {|p| p.created_at.month } # lolwut
		months = [0] * 12 # lolwut
		data.each { |d| months[d] += 1 } # sort of like bucket sort? :p
		names = [] ; vals = [] # XXX bleh
		(0..5).to_a.each do |n|
			m = n.months.ago.month
			y = n.months.ago.year
			names[n] = m.to_s + '/' + y.to_s  # XXX bleh
			vals[n] = months[m]
		end
		return {:months => names, :values => vals}
	end

  # Simply removes all non-alphanumerics
  def defaults
		self.short_id = self.id
  end

	def encrypt_pass
		self.pass_hash = Password.create(self.password) if self.password
	end

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
		 :short_id => self.short_id}
#	 :plans => self.plans.map(&:as_hash)}
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
