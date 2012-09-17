require 'mongoid'
require 'bcrypt'

class BankAccount

	include Mongoid::Document
	include Mongoid::Timestamps

	# Fields

	field :bank_name, type: String
	field :uri, type: String
	field :last_four, type: String
	field :merchant_id, type: String

	# Validations

  # Associations

	belongs_to :account

  # Callbacks
	
	before_validation do
		# Create a new merchant on balanced
		begin
			merchant = Balanced::Marketplace.my_marketplace.create_merchant(
				self.account.email,
				{
					:type => "person",
					:name => self.account.name,
					:street_address => "",
					:postal_code => "",
					:region => "EX",
					:country => "USA",
					:dob => "1842-01",
					:phone_number => self.account.phone_number
				},
				nil, #self.uri,
				self.account.name)
			self.merchant_id = merchant.id
		rescue Balanced::Conflict => ex
			errors.add('', 'Balanced payments merchant account creation: conflict -- ' + ex.to_s);
			# handle the conflict here..
		rescue Balanced::BadRequest => ex
			errors.add('', 'Bad request: ' + ex.to_s)
			puts ex
			# prompt for fix, then retry
		rescue Balanced::MoreInformationRequired => ex
			redirect_to ex.redirect_uri + '?redirect_uri=' + after_redirection
		end
	end


	def as_hash
		{:bank_name => self.bank_name,
		 :last_four => self.last_four}
	end

	def first_error
		## Return the very first error in a readable string
		# Get the field name of the first error
		# then get the message for the field name of the first error
		self.errors.to_hash.first.first.to_s +
			' ' + self.errors.to_hash.first.second.first.to_s
	end

end
