# coding: utf-8
require './tests/testify'

class AccountTester
	include Testify

	def initialize
		@valid = {:email => "example#{rand(36**16)}@email.com", :password => 'password'}
		@bad_data = [
			@valid.merge(:email => 'x'),
			@valid.merge(:email => nil),
			@valid.merge(:password => nil),
			@valid.merge(:password => 'xyz'),
		]
	end

	def creates_account_validly
		@action = 'post' ; @path = '/account'
		@req = H.post R + @path, :query => @valid
		expecting @req['success'] && @req['account']['email'] == @valid[:email]
	end

	def creates_account_invalidly
		@bad_data.each do |bad_data|
			@req = H.post R + @path,:query => bad_data
			expecting !@req['success'] && @req['errors']
		end
	end

	def authorizes_with_existing_account
		@action = 'post' ; @path = '/'
		@req = H.post R + @path, :query => {:auth => @valid}
		expecting @req['success'] &&
			@req['account']['email'] == @valid[:email] && @req['session_token']
		@session_token = @req['session_token']

		@bad_data.each do |bad_data|
			@req = H.post R + @path, :query => {:auth => bad_data}
			expecting !@req['success'] && @req['message']
		end
	end

	def updates_account
		# Update name
		@action = 'put' ; @path = '/account'
		@req = H.put R + @path,
			:query => {:account => {:name => 'capybara riding club'},
				:session_token => @session_token}
		expecting @req['success'] && @req['account']['name'] == 'capybara riding club'

		# Update email
		@req = H.put R + @path,
			:query => {:account => {:email => 'xx@yy.zz'},
				:session_token => @session_token}
		expecting @req['success'] && @req['account']['email'] == 'xx@yy.zz'

		# Update password
		@req = H.put R + @path,
			:query => {:account => {:password => 'password'},
				:session_token => @session_token}
		@req = H.post R + '/', :query => {:auth => {:password => 'password', :email => 'xx@yy.zz'}}
		expecting @req['success']
		@session_token = @req['session_token']
	end

	def views_account
		@action = 'get' ; @path = '/account'
		@req = H.get R + @path, :query => {:session_token => @session_token}
		expecting @req['success'] && @req['account']['email'] == 'xx@yy.zz'
	end

	def logs_out_and_back_in
		@action = 'delete' ; @path = '/'
		@req = H.delete R + @path, :query => {:session_token => @session_token}
		expecting @req['success'] && @req['message']
		@action = 'post' ; @path = '/'

		@req = H.post R + '/', :query => {:auth => {:password => 'password', :email => 'xx@yy.zz'}}
		expecting @req['success']
		@session_token = @req['session_token']
	end

	def destroys_account
		@action = 'delete' ; @path = '/account'
		@req = H.delete R + @path, :query => {:session_token => @session_token}
		expecting @req['success'] && @req['message']
	end

	def all
		creates_account_validly
		creates_account_invalidly
		authorizes_with_existing_account
		updates_account
		views_account
		logs_out_and_back_in
		destroys_account
	end

	def min
		creates_account_validly
	end

end

puts "Account tests go!".blue
start = Time.now
account_tester = AccountTester.new
account_tester.all
done = Time.now
puts "Time elapsed: #{(done - start)} seconds".blue
