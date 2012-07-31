require './controllers/application.rb'

class Application < Sinatra::Base

	post '/account' do
		@account = Account.new @params
		if @account.save
			json @account.as_hash.merge(:session_token => @account.generate_session_token)
		else
			halt 400, @account.first_error
		end
	end

	put '/account', :auth => :account do
		if @account.update_attributes @params
			json @account.as_hash
		else
			halt 400, @account.first_error
		end
	end

	delete '/account', :auth => :account do
		@account.destroy
		json :success => true, :message => ":'("
	end

	get '/account', :auth => :account do
		json @account.as_hash
	end

	post '/share/?', :auth => :account do
		# XXX this was pretty much duplicated from plans/share
		people = @params['emails'].split # get posted string of emails, split by spaces
		people = people.map do |e| # map over emails, strip comma, create the profile
			e = e[0..-2] if e[-1] == ',' # strip out the comma
			p = @account.profiles.build({:email => e}) # build profile with email and default subscription
			p.save ? p.as_hash : {} # if valid, return the profile as a hash, else return empty hash
		end
		puts people
		json people # respond with newly-created batch of people
	end

	get '/:account_id/share/?' do
		@acct = Account.find params['account_id']
		erb 'share'
	end

end
