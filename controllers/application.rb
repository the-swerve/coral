require 'sinatra/base'
require 'sinatra/json'

Dir['./models/*.rb'].each {|f| require f}

class Application < Sinatra::Base

	enable :sessions, :logging
	set :session_secret, 'xaro xhoan daxos'
	set :root, File.dirname('../')

	helpers Sinatra::JSON

	helpers do
		def is_account?
			@account != nil
		end

		def is_profile?
			@profile_user != nil
		end

		def infer_and_check_resources path
			path.each do |p|
			end
		end
	end

	set :auth do |*roles|
		condition do
			unless roles.map {|r| send("is_#{r}?")}.any?
				halt 401, 'unauthorized'
			end
		end
	end

	before do

		# Backbone.js passes post data as a string in the JSON format rather than
		# the query format, which sinatra expects. 
		body = request.body.read.to_s
		begin
			puts "\nbody: " + body
			@params = JSON.parse(body)
		rescue
			@params = params
		end

		puts "\n" + 'Parameters: ' + @params.to_s
		puts request.request_method + ' '+ request.fullpath
		puts request.cookies['coral.session_token']
		toke = request.cookies['coral.session_token'] || @params['session_token']
		if toke
			@account = Account.where(session_token: toke).first
			@profile_user = Profile.where(session_token: toke).first
		end
		puts @account.email if @account
		puts @profile_user.email if @profile_user
		@current_user = @account || @profile_user
	end

	error { halt 501, 'There was an error :/'}
	not_found { halt 404, 'not found  (404)' }

	get '/' do
		if @account ; erb :dashboard
		elsif @profile_user ; erb :public
		else ; erb :welcome ; end
	end

	post '/' do
		if @params['auth']
			@account = Account.where(email: @params['auth']['email']).first
			@profile_user = Profile.where(email: @params['auth']['email']).first
			if @account && @account.authenticate(@params['auth']['password'])
				@current_user = @account
				json :session_token => @account.generate_session_token, :account => @account.as_hash
			elsif @profile_user && @profile_user.authenticate(@params['auth']['password'])
				@current_user = @profile_user
				json :session_token => @profile_user.generate_session_token, :profile => @profile_user.as_hash
			else
				halt 400, 'Invalid email or password'
			end
		else
			halt 400, 'Invalid email or password'
		end
	end

	delete '/', :auth => [:account, :profile] do
		@account.destroy_session_token if @account
		@profile_user.destroy_session_token if @profile_user
		json :success => true, :message => 'until next time...'
	end

	get '/logout' do
		@account.destroy_session_token if @account
		@profile_user.destroy_session_token if @profile_user
		request.cookies.delete 'coral.session_token'
		redirect '/'
	end

end
