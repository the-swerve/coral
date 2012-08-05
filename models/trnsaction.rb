require 'active_support/core_ext' # for date operations

class Trnsaction

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :amount, Integer,
	field :action, String,
	field :successful, String,
	field :message, String,

	# Validations
	
	validates :amount, required: true
	validates :action,
		required: true,
		inclusion: {in: ['Payment','Void']}
	validates :successful, required: true
	validates :message, required: true

	# Associations

  belongs_to :charge

	# Callbacks

	before_validation :defaults, :on => :create

	def as_hash
		{:amount => self.amount.to_s,
		 :action => self.action,
		 :successful => self.successful.to_s,
		 :date => self.created_at.to_date.to_s,
		 :message => self.message}
	end

	private

	# Callbacks
	def defaults
		self.action ||= 'Payment'
		self.message = "Test transaction"
		self.successful ||= 'true'
		if self.successful == 'true'
			self.amount = self.charge.amount
			self.amount = -self.amount if self.action == 'Void'
		else
			self.amount = 0
		end
	end

end
