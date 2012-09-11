require 'mongoid'
require 'bcrypt'

class BankAccount

	include Mongoid::Document
	include Mongoid::Timestamps

	# Fields

	field :bank_name, type: String
	field :name, type: String
	field :uri, type: String
	field :last_four, type: String

	# Validations

  # Associations

	belongs_to :account

  # Callbacks
	


	def as_hash
		{:name => self.name,
		 :bank_name => self.bank_name,
		 :last_four => self.last_four}
	end

end
