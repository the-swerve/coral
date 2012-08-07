require 'active_support/core_ext' # for date operations

class Trnsaction

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

	# Accessors

	# Fields

	field :amount, type: Integer
	field :action, type: String
	field :successful, type: String
	field :message, type: String

	# Validations
	
	validates :amount, presence: true
	validates :action,
		presence: true,
		inclusion: {in: ['Payment','Void']}
	validates :successful, presence: true
	validates :message, presence: true

	# Associations

  belongs_to :charge

	# Callbacks

	before_validation(:on => :create) do
		self.action ||= 'Payment'
		self.message = 'Test transaction'
		self.successful ||= 'true'

		if self.successful == 'true'
			self.amount = self.charge.amount
			self.amount = -self.amount if self.action == 'Void'
		else
			self.amount = 0
		end

	end

	def as_hash
		{:amount => self.amount.to_s,
		 :action => self.action,
		 :successful => self.successful.to_s,
		 :date => self.created_at.to_date.to_s,
		 :message => self.message}
	end

	private

end
