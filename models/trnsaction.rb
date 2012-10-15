require 'active_support/core_ext' # for date operations
require './lib/balanced'


class Trnsaction

	# Inclusions

	include Mongoid::Document
	include Mongoid::Timestamps
	include BalancedAPI

	# Accessors

	# Fields

	field :amount, type: Integer # Note: this is in cents
	field :action, type: String
	field :successful, type: String
	field :message, type: String
	field :hold_uri, type: String

	# Validations
	
	validates :amount, presence: true
	validates :action,
		presence: true,
		inclusion: {in: ['Payment','Void']}
	validates :successful, presence: true
	validates :message, presence: true

	# Associations

  belongs_to :charge
  belongs_to :profile

	# Callbacks

	before_validation(on: :create) do
		self.action ||= 'Payment'

		if self.action == 'Payment'
			response = BalancedAPI.create_hold(self.profile.buyer_uri, self.charge.amount)
			if response['uri']
				self.hold_uri = response['uri']
				# We've successfully placed a hold, now we need to capture it
				response = BalancedAPI.capture_hold(self.hold_uri)
				if response['uri']
					self.charge.debit_uri = response['uri']
					success = true
				else ; success = false ; end
			else
				success = false
			end

			if success
				self.successful = 'true'
				self.message = 'Successful transaction'
				self.amount = self.charge.amount
			else
				self.successful = 'false'
				self.amount = 0
				if response['description']
					self.message = response['description']
				elsif response['status']
					self.message = response['status']
				else
					self.message = 'Transaction failed. Try again or use a different payment method.'
				end
			end
		elsif self.action == 'Void'
			response = BalancedAPI.create_refund({debit_uri: self.charge.debit_uri})
			if response['amount']
				self.successful = 'true'
				self.message = 'In progress'
				self.amount = -self.charge.amount
			else
				self.successful = 'false'
				self.amount = 0
				if response['description']
					self.message = response['description']
				elsif response['status']
					self.message = response['status']
				else
					self.message = 'Void failed.'
				end
			end
		end
	end


	def as_hash
		{:amount => self.amount.to_s,
		 :action => self.action,
		 :successful => self.successful.to_s,
		 :date => self.created_at.to_date.to_s,
		 :message => self.message}
	end

	private

end
