# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Plan do

	let(:pf) {PlanFactory.new}

	describe 'creating' do
		context 'with valid data' do
			it 'creates a new plan' do
				post '/plans', {:plan => pf.valid, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['plan']['name'].should == pf.valid[:name]
			end
		end

		context 'without valid data' do
			it 'fails to create' do
				pf.bad_data.each do |d|
					post '/plans', {:plan => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # describe creating
 
	describe 'indexing' do
		it 'returns all plans' do
			get '/plans', :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['plans'].size.should == Plan.all.size
		end
	end # describe indexing

	describe 'viewing' do
		it 'returns a plan' do
			p = Plan.all.last
			get "/plans/#{p.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['plan']['name'].should == p.name
		end
	end # describe viewing

	describe 'updating' do
		context 'with valid data' do
			it 'updates the plan' do
				p = Plan.all.last
				put "/plans/#{p.short_id}", {:plan => {:name => 'new'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['plan']['name'].should == 'new'
			end
		end

		context 'without valid data' do
			it 'fails' do
				p = Plan.all.last
				pf.bad_data.each do |d|
					put "/plans/#{p.short_id}", {:plan => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # describe updating

	describe 'destroying' do
		it 'removes the plan from the db' do
			p = Plan.all.last
			delete "/plans/#{p.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			Plan.all.should be_empty
		end
	end # describe destroying

end
