
# Bank Accounts
# #############
#
# Bank accounts represent an ACH token that can receive funds.
#
# Bank accounts may not send funds.
#
# Bank accounts are only tied to Accounts (merchant accounts)

require 'mongoid'
require 'bcrypt'
require './lib/balanced'

class BankAccount

	include Mongoid::Document
	include Mongoid::Timestamps
	include BalancedAPI

	# Fields

	field :bank_name, type: String
	field :uri, type: String
	field :last_four, type: String

	# Validations

  # Associations

	belongs_to :account

  # Callbacks

	before_validation do
		# Put this new bank account into our balanced merchant account
		response = BalancedAPI.update_account(self.account.merchant_uri, {
			bank_account_uri: self.uri
		})
		# XXX add error checking
	end

	before_destroy do
		response = BalancedAPI.invalidate_bank_account(self.uri)
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
