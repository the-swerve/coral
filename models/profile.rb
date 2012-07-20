require 'mongo_mapper'
require 'bcrypt'
require 'state_machine'

class Profile

	include MongoMapper::Document
	include BCrypt

	attr_accessor :email, :name, :password

	key :email, String,
		:required => true,
		:format => /^[a-zA-Z][\w\.-]*[a-zA-Z0-9]@[a-zA-Z0-9][\w\.-]*[a-zA-Z0-9]\.[a-zA-Z][a-zA-Z\.]*[a-zA-Z]$/
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
	after_create :add_payment_method

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
		end

		state :paid do
		end

		state :unpaid do
		end

		state :expired do
		end

		state :in_trial do
		end
	end

	def balance
		charges.where(:state => 'unpaid').map(&:amount).sum || 0
	end

	def pay_all
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
		{:name => self.name,
		 :email => self.email,
		 :subscriptions => self.subscription_list,
		 :state => self.state,
		 :id => self.short_id.to_s}
	end

	def subscription_list
		if subscriptions.empty?
			'None'
		else
			subscriptions.collect {|s| s.plan.name}.join ', '
		end
	end

  private

  # Callbacks
  def defaults
		self.password ||= rand(36**8).to_s(36)
		self.short_id = self.account.profiles.size
		self.name ||= 'unnamed'
  end

	def encrypt_pass
		self.pass_hash = Password.create(self.password)
	end

  def capitalize_name
		self.name.split.each { |x| x.capitalize!}.join(' ')
  end

	def add_payment_method
		self.payment_methods.create if self.payment_methods.all.empty?
	end

end
