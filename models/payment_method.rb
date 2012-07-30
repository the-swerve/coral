require 'mongo_mapper'
require 'mongo_sequence'

class PaymentMethod

	include MongoMapper::Document

	key :name, String,
		:required => true
	key :active, Boolean
	key :pay_type, String

	key :short_id, String

	timestamps!

	# Associations
	belongs_to :profile

	before_validation :defaults, :on => :create

	def as_hash
		{:name => self.name,
		:active => self.active.to_s,
		:pay_type => self.pay_type}
	end

	def defaults
		self.name ||= 'Automatic payment method # ' + (self.profile.payment_methods.size + 1).to_s
		self.short_id = self.id
		self.active = true
		self.pay_type = 'card'
	end

end
