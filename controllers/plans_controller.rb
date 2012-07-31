require './controllers/application.rb'

class Application < Sinatra::Base

	post '/plans/?', :auth => :account do
		@plan = @account.plans.build @params
		if @plan.save
			puts 'saved plan: ' + @plan.as_hash.to_s
			json(@plan.as_hash)
		else
			halt(400, @plan.first_error)
		end
	end

	get '/plans/?', :auth => :account do
		json @account.plans.reduce({}) {|ps,p| ps.merge({p.name => p.as_hash})}
	end

	get '/plans/:plan_id', :auth => :account do
		@plan = @account.plans.first(:short_id => params[:plan_id].to_i)
		if @plan
			json :success => true, :plan => @plan.as_hash
		else
			json :success => false, :errors => 'not found'
		end
	end

	# post a string of many emails, separated by strings
	# will send email invitations to each
	post '/share/:plan_id', :auth => :account do
		@plan = Plan.find params['plan_id'] # fetch plan model
		if @plan
			people = @params['emails'].split # get posted string of emails, split by spaces
			people = people.map do |e| # map over emails, strip comma, create the profile
				e = e[0..-2] if e[-1] == ',' # strip out the comma
				p = @account.profiles.build({:email => e, :plan_id => @plan.id}) # build profile with email and default subscription
				p.save ? p.as_hash : {} # if valid, return the profile as a hash, else return empty hash
			end
			json people # respond with newly-created batch of people
		else
			halt 400, 'plan not found'
		end
	end

	put '/plans/:plan_id', :auth => :account do
		@plan = @account.plans.find params['plan_id']
		if @plan
			@plan.update_attributes(@params) ? json(@plan.as_hash) : halt(400, @plan.first_error)
		else ; halt 400, 'plan not found' ; end
	end

	delete '/plans/:plan_id', :auth => :account do
		@plan = @account.plans.find params['plan_id']
		if @plan
			@plan.destroy
			json :message => "plan pushed into the ether :'("
		else ; halt 400, 'plan not found' ; end
	end

	get '/share/:plan_id' do
		@plan = Plan.find @params['plan_id']
		erb :share
	end

end
