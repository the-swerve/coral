require 'sinatra'
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
				throw :halt,
					[401, json(:success => false, :message => 'unauthorized (401)')]
			end
		end
	end

	before do

		# Backbone.js passes post data as a string in the JSON format rather than
		# the query format, which sinatra expects. 
		body = request.body.read.to_s
		if params.empty? && !body.empty?
		puts "\nbody: " + body
			@params = JSON.parse(body)
		else
			@params = params
		end

		puts "\n" + 'Parameters: ' + @params.to_s
		puts request.request_method + ' '+ request.fullpath
		puts request.cookies['coral.session_token']
		toke = request.cookies['coral.session_token'] || @params['session_token']
		if toke
			@account = Account.first(:session_token => toke)
			@profile_user = Profile.first(:session_token => toke)
		end
		puts @account.email if @account
		puts @profile_user.email if @profile_user
		@current_user = @account || @profile_user
	end

	error do
		throw :halt, [501, json(:errors => env['sinatra.error'].name)]
	end

	not_found do
		throw :halt,
			[404, json(:success=> false, :message => 'not found (404)')]
	end

	get '/' do
		if @account ;    erb :dashboard
		elsif @profile_user ; erb :public
		else ;           erb :welcome ; end
	end

	post '/' do
		if @params['auth']
			@account = Account.first(:email => @params['auth']['email'])
			@profile_user = Profile.first(:email => @params['auth']['email'])
			if @account && @account.authenticate(@params['auth']['password'])
				@current_user = @account
				json :success => true, :session_token => @account.generate_session_token,
					:role => 'administrator', :account => @account.as_hash
			elsif @profile_user && @profile_user.authenticate(@params['auth']['password'])
				@current_user = @profile_user
				json :success => true, :session_token => @profile_user.generate_session_token,
					:role => 'administrator', :profile => @profile_user.as_hash
			else
				json :success => false, :message => 'invalid credentials'
			end
		else
			json :success => false, :message => 'no authorization parameters provided'
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

	get '/share/:planid' do
		@plan = Plan.first(:short_id => @params[:planid].to_i)
		erb :share
	end

end
