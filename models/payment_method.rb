require 'mongo_mapper'

class PaymentMethod

	include MongoMapper::Document

	key :name, String,
		:required => true

	key :short_id, Integer

	timestamps!

	# Associations
	belongs_to :profile

	before_validation :defaults, :on => :create

	def as_hash
		{:name => self.name}
	end

	def defaults
		self.name ||= 'your payment method # ' + (self.profile.payment_methods.size + 1).to_s
		self.short_id = self.profile.payment_methods.size
	end

end
