# A data library for testing
#
# I used factory_girl for a short time and ended up spending hours and hours
# wrestling with it to work with certain details like Timecop. Instead,
# providing a simple library of hashes has proven to actually work way better.

class AccountFactory

	attr_accessor :valid, :bad_emails, :bad_passes

	def initialize
		@valid = {:email => 'example@email.com', :password => 'password'}
		@bad_emails = ["","x","x@y"] # Could add more, but they'd slow down the tests a lot.
		@bad_passes = ["","x"]
	end

end

class PlanFactory

	attr_accessor :valid, :bad_data

	def initialize
		@valid = {
			:name => 'x', :amount => 1,
			:initial_charge => 2,
			:cycle_length => 1,
			:cycle_type => 'month',
			:trial_length => 1,
			:trial_type => 'week'
		}

		@bad_data = [
			@valid.merge(:name => nil),
			@valid.merge(:amount => nil),
			@valid.merge(:cycle_length => nil),
			@valid.merge(:cycle_type => nil),
			@valid.merge(:cycle_type => 'wat'),
			@valid.merge(:trial_type => 'wat'),
			@valid.merge(:trial_type => nil),
			@valid.merge(:trial_length => nil)
		]
	end
end

class ProfileFactory

	attr_accessor :valid, :bad_data

	def initialize
		@valid = { :name => 'bob ross', :email => 'xx@yy.zz' }
		@bad_data = [
			@valid.merge(:email => nil),
			@valid.merge(:email => 'x'),
			@valid.merge(:email => 'x@x')
		]
	end
end

class ChargeFactory

	attr_accessor :valid, :bad_data

	def initialize
		@valid = { :name => 'x', :amount => 1}
		@bad_data = [
			@valid.merge(:amount => nil),
			@valid.merge(:amount => -1),
			@valid.merge(:due_date => Date.today - 1.day)
		]
	end
end

class SubscriptionFactory

	attr_accessor :valid, :bad_data

	def initialize
		@valid = {}
		@bad_data = [
			@valid.merge(:expiration_date => nil),
			@valid.merge(:amount => nil),
			@valid.merge(:amount => -1),
		]
	end
end

class TransactionFactory

	attr_accessor :valid, :bad_data

	def initialize
		@valid = {:amount => 1}
		@bad_data = [
			{:amount => nil}
		]
	end
end
