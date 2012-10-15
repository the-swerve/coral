## A ruby interface to the Balanced API.
# Jay R Bolton, 10.13.2012
#
# This module is stateless, so you don't have to create any objects or
# anything. We can leave the state up to balanced. It's up to you to write data
# returned from this module to your db.
#
## Initialization
#
# bal = BalancedAPI.new 'your api key'
#
## Account Creation 
# 
# bal.

require 'faraday'
require 'json'

module BalancedAPI

	attr_accessor :response

	@api_key = 'e9234bfacc5211e1bda6026ba7e239a9'
	@marketplace_uri = 'TEST-MP761XGxjonKUa4HBnXOMoGy'
	# Initialize HTTP connection for Faraday
	@conn = Faraday.new(:url => 'https://api.balancedpayments.com') do |x|
		x.basic_auth @api_key, ''
		x.request :url_encoded
		x.response :logger
		x.adapter Faraday.default_adapter
	end

	# Accounts

	def self.create_account payload
		# https://www.balancedpayments.com/docs/api#accounts
		uri = 'v1/marketplaces/' + @marketplace_uri + '/accounts'
		return JSON(@conn.post(uri, payload).body)
	end

	def self.update_account merchant_uri, payload
		# Updateable fields: email_address, name, merchant_uri, card_uri, bank_account_uri
		# https://www.balancedpayments.com/docs/api#accounts
		return JSON(@conn.put(merchant_uri, payload).body)
	end

	def self.invalidate_bank_account bank_account_uri
		# https://www.balancedpayments.com/docs/api#bank-accounts
		return JSON(@conn.put(bank_account_uri, {is_valid: 'false'}).body)
	end

	def self.credit_account payload
		# Payload must include account_uri and amount
		# https://www.balancedpayments.com/docs/api#credits
		uri = 'v1/marketplaces/' + @marketplace_uri + '/credits'
		return JSON(@conn.post(uri, payload).body)
	end

	# Charges
	
	def self.create_hold buyer_uri, amount
		# https://www.balancedpayments.com/docs/api#escrow-a-payment
		uri = buyer_uri + '/holds'
		return JSON(@conn.post(uri, {amount: amount}).body)
	end

	def self.capture_hold hold_uri, amount=nil
		# https://www.balancedpayments.com/docs/api#escrow-a-payment
		# Pass in the hold_uri received from create_hold as well as the amount (optional). If amount is not provided, balanced captures the total.
		payload = {hold_uri: hold_uri}
		payload.merge({amount: amount}) if amount != nil
		uri = 'v1/marketplaces/' + @marketplace_uri + '/debits'
		return JSON(@conn.post(uri, payload).body)
	end

	def self.create_refund payload
		# https://www.balancedpayments.com/docs/api#refunds
		# Payload must include debit_uri and amount
		uri =  'v1/marketplaces/' + @marketplace_uri + '/refunds'
		return JSON(@conn.post(uri, payload).body)
	end

	# Utilities

	def check_requirements *vars
		missing = vars.reduce [] {|vs,v| vs << v if !instance_variable_get("@#{v}")}
		missing ? 'Missing data: ' + missing.join(', ') : nil
	end

end
