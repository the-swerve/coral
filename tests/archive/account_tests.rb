# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Account do

	# Accounts are top-level users of the app and embody companies, landlords, gyms, etc

	describe 'authorization' do

		it 'fails with invalid pass' do
			post '/', :auth => @af.valid.merge(:password => 'x')
			j = JSON.parse(last_response.body)
			j["success"].should == false
		end

		it 'succeeds with valid pass' do
			post '/', :auth => @af.valid
			j = JSON.parse(last_response.body)
			@auth = j['session_token']
			j["success"].should == true
		end

		it 'logs out and destroys session token' do
			puts 'xxx'
			puts 'given token: ' + @auth.to_s
			puts 'actual token: ' + @ac.session_token.to_s
			delete '/', :session_token => @auth
			puts 'xxx'
			puts last_response.body
			j = JSON.parse(last_response.body)
			j["success"].should == true
		end
	end

	describe 'updating' do
		context 'with valid data' do
			it 'updates email' do
				put '/account', {:account => {:email => 'xx@yy.zz'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['account']['email'].should == 'xx@yy.zz'
				put '/account', {:account => {:email => 'example@email.com'}, :auth => @af.valid.merge(:email => 'xx@yy.zz')} # reset
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['account']['email'].should == 'example@email.com'
			end
			it 'updates name' do
				put '/account', {:account => {:name => 'x'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['account']['name'].should == 'x'
			end
			it 'updates password' do
				put '/account', {:account => {:password => '123456'}, :auth => @af.valid}
				post '/authorize', :auth => @af.valid.merge(:password => '123456')
				j = JSON.parse(last_response.body)
				j['success'].should == true
				put '/account', {:account => {:password => 'password'}, :auth => @af.valid.merge(:password=>'123456')}
				post '/authorize', :auth => @af.valid.merge(:password => 'password')
				j = JSON.parse(last_response.body)
				j['success'].should == true
			end
		end
		
		context 'with invalid data' do
			it 'does not update (invalid email)' do
				put '/account', {:account => {:email => '@yy.zz'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == false
			end
			it 'does not update (invalid password)' do
				put '/account', {:account => {:password => 'x'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == false
			end
		end
	end

	describe 'viewing' do
		it 'returns the account data' do
			get '/account', :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['account']['email'].should == @af.valid[:email]
		end
	end

	describe 'destroying' do
		it 'removes the account' do
			delete '/account', :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			Account.all.should be_empty
		end
	end
	
end
