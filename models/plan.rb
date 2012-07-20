require 'mongo_mapper'

class Plan

	include MongoMapper::Document

	attr_accessor :cycle

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

	key :short_id, Integer

	validate :trial_length_requires_trial_type
	validate :cycle_length_requires_cycle_type
	validates_format_of :cycle, :with => /^\d (month|day|week|year)s?$/

	timestamps!

	# Callbacks
	before_validation :defaults, :on => :create

  # Associations
	belongs_to :account
	many :subscriptions, :dependent => :destroy
	many :profiles, :through => :subscriptions

	def as_hash
		{:name => self.name.to_s,
		 :amount => self.amount.to_s,
		 :cycle_length => self.cycle_length.to_s,
		 :cycle_type => self.cycle_type.to_s,
		 :initial_charge => self.initial_charge.to_s,
		 :trial_length => self.trial_length.to_s,
		 :trial_type => self.trial_length.to_s,
		 :description => self.description.to_s,
		 :url => '/share/' + self.short_id.to_s
		}
	end

	def url
		'/share/' + self.short_id.to_s
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

	def defaults
		self.short_id = Plan.all.size
		self.initial_charge ||= 0
		if self.cycle
			self.cycle_length = self.cycle.split.first.to_i
			self.cycle_type = self.cycle.split.last
		end
	end

end
