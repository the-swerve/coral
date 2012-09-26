require 'mongoid'
require 'balanced'

class PaymentMethod

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps

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
		self.name ||= 'Credit card (' + self.brand + '): *' + self.last_four
		begin
			buyer = Balanced::Marketplace.my_marketplace.create_buyer(self.profile.email, self.uri)

			puts '~~~~~~!!!!!!!!'
			puts self.profile.as_hash
			begin
				self.profile.update_attribute('buyer_uri',buyer.uri)
			rescue
				errors.add('','This person has invalid data.')
			end
		rescue
			if self.profile.buyer_uri
				begin
					x = Balanced::Account.construct_from_response({uri: self.profile.buyer_uri})
					x.add_card(self.uri)
				rescue
					errors.add('','Error: invalid data.') # XXX blech. maze of exceptions
				end
			else
				errors.add('','Error: invalid data')
			end
		end
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
