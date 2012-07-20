require 'mongo_mapper'

class Trnsaction

	include MongoMapper::Document

	# Constants
	ACTIONS = ['Payment','Payment-voided','Void'] # XXX wat is payment-voided?

	key :amount, Integer,
		:required => true

	key :action, String,
		:required => true,
		:inclusion => ACTIONS

	# Note: mongomapper will always fail validation on a Boolean false value
	# (it's really dumb, I know). So we're storing this as a string.
	key :successful, String,
		:required => true,
		:inclusion => ['true','false']

	key :message, String,
		:required => true

	timestamps!

	# Associations
  belongs_to :charge

	# Callbacks
	before_validation :defaults, :on => :create

	def as_hash
		{:amount => self.amount.to_s,
		 :action => self.action,
		 :successful => self.successful.to_s,
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
