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

	get '/share/:plan_id' do
		@plan = Plan.find params['plan_id']
		puts @plan.to_hash
		if @plan
			json :success => true, :plan => @plan.as_hash
		else
			json :success => false, :errors => 'not found'
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

end
