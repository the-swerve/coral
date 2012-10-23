
# Payment Methods
# ###############
#
# Profiles can have one or more payment methods, which represents credit cards or bank accounts.
#
# A charge may be created using a payment method.
#
# Payment methods may only give money, not receive.

require 'mongoid'
require './lib/balanced'

class PaymentMethod

	attr_accessor :sub_plan_id

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps
	include BalancedAPI

	# Accessors

	# Fields

	field :name, type: String
	field :pay_type, type: String # either card or ach
	field :last_four, type: String # last four digits of either credit card or bank account number
	field :uri, type: String # balanced URI for this card

	# Credit cards only

	field :brand, type: String

	# Validations

	# Associations

	belongs_to :profile
	has_many :subscriptions
	has_many :charges

	# Callbacks

	before_validation(:on => :create) do
		# Create a readable name for this card
		self.name ||= 'Credit card (' + self.brand + '): *' + self.last_four
		# Attach the card to the buyer on balancedpayments.com
		response = BalancedAPI.update_account(self.profile.buyer_uri, {
			card_uri: self.uri
		})
		# TODO add error checking
	end

	before_destroy do
		# TODO invalidate payment method on balancedpayments.com
	end

	def as_hash
		{:name => self.name,
		 :last_four => self.last_four,
		 :brand => self.brand,
		:id => self.id.to_s}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

end
