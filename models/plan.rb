require 'mongo_mapper'

class Plan

	include MongoMapper::Document

	attr_accessor :cycle, :url

	key :name, String,
		:required => true

	key :amount, Float,
		:required => true

	key :cycle_length, Integer,
		:required => true
	key :cycle_type, String,
		:required => true,
		:format => /^(month|day|week|year)?s?$/

	key :initial_charge, Float

	key :trial_length, Integer
	key :trial_type, String,
		:format => /^(month|day|week|year)?s?$/

	key :description, String

	key :short_id, String

	validate :trial_length_requires_trial_type
	validate :cycle_length_requires_cycle_type
	validate :unique_name_for_account
	validates_format_of :cycle, :with => /^\d (month|day|week|year)s?$/

	timestamps!

	# Callbacks
	before_validation :defaults, :on => :create
	before_save :parse_cycle

  # Associations
	belongs_to :account
	many :subscriptions, :dependent => :destroy
	many :profiles, :through => :subscriptions
	many :charges

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

	def trial_length_requires_trial_type
    if self.trial_length && !self.trial_type
      errors.add(:trial_length, 'requires a trial type')
		elsif self.trial_type && !self.trial_length
      errors.add(:trial_type, 'requires a trial length')
    end
	end
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
