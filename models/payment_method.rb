require 'mongoid'

class PaymentMethod

	# Inclusions

	include Mongoid::Document

	# Accessors

	attr_accessor :cc_number, :acct_number

	# Fields

	field :name, type: String
	field :active, type: Boolean
	field :pay_type, type: String
	field :last4, type: String

	# Validations

	validates :pay_type, presence: {on: :create}
	validates :last4, presence: {on: :create}

	# Associations

	belongs_to :profile

	# Callbacks

	before_validation(:on => :create) do
		self.name ||= self.pay_type + ' *' if self.pay_type
		n = self.cc_number != '' ? self.cc_number : self.acct_number != '' ? self.acct_number : ''
		self.last4 = n.to_s[-4..-1]
		self.name += self.last4 if self.last4

		if self.cc_number == '' && self.pay_type == 'Credit Card'
			self.errors.add('', 'missing credit card number')
		elsif self.acct_number == '' && self.pay_type == 'E-check'
			self.errors.add('', 'missing bank account number')
		end
		errors.add('', 'invalid credit card or bank account number') if !last4
	end

	def as_hash
		{:name => self.name,
		:active => self.active.to_s,
		:pay_type => self.pay_type,
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
