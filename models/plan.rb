require 'mongoid'

class Plan

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors
	# cycle represents the whole-string version of the billing cycle, such as '3
	# months' or '1 month' and so on, which we can parse into the integer and the
	# type after receiving it (for convenience to the api user)
	attr_accessor :cycle

	# Fields

	field :name, type: String
	field :amount, type: Float
	field :cycle_length, type: Integer
	field :cycle_type, type: String
	field :initial_charge, type: Float
	field :description, type: String
	field :short_id, type: String

	# Validations

	validates :name, presence: true
	validates :amount, presence: true
	validates :cycle_length, presence: true
	validates :cycle_type,
		presence: true,
		format: {with: /^(month|day|week|year)?s?$/}
	validates :cycle,
		format: {with: /^\d (month|day|week|year)s?$/}
	validate :cycle_length_requires_cycle_type
	validate :unique_name_for_account

	# Callbacks
	before_validation :defaults, :on => :create
	before_save :parse_cycle

  # Associations
	belongs_to :account
	has_many :subscriptions, :dependent => :destroy
	has_many :charges

	def as_hash
		{:name => self.name,
		 :amount => self.amount.to_s,
		 :cycle => self.cycle_str,
		 :initial_charge => self.initial_charge.to_s,
		 :description => self.description.to_s,
		 :url => '/share/' + self.id.to_s,
		 :id => self.id.to_s}
	end

	def url
		'/share/' + self.id
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

	def cycle_str
		self.cycle_length.to_s + ' ' + self.cycle_type
	end

	private

	def cycle_length_requires_cycle_type
    if self.cycle_length && !self.cycle_type
      errors.add(:cycle_length, 'requires a cycle type')
		elsif self.cycle_type && !self.cycle_length
      errors.add(:cycle_type, 'requires a cycle length')
    end
	end
	def unique_name_for_account
		if false
			errors.add(:name, 'has already been used')
		end
	end

	def defaults
		self.short_id = self._id
		self.initial_charge ||= 0
		parse_cycle
	end

	def parse_cycle
		if self.cycle
			self.cycle_length = self.cycle.split.first.to_i
			self.cycle_type = self.cycle.split.last
		end
	end

end
