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
	belongs_to :subscription
	has_many :charges

	# Callbacks

	before_validation(:on => :create) do
		if self.sub_plan_id && self.sub_plan_id != ''
			self.subscription_id = self.profile.subscriptions.where(plan_id: self.sub_plan_id).first.id
		end
		# Create a readable name for this card
		self.name ||= 'Credit card (' + self.brand + '): *' + self.last_four
		# Attach the card to the buyer on balancedpayments.com
		response = BalancedAPI.update_account(self.profile.buyer_uri, {
			card_uri: self.uri
		})
		puts response
	end

	before_destroy do
	end

	def as_hash
		{:name => self.name,
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
