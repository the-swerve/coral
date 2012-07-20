# Behavioral tests of the API.

require './tests/spec_helper.rb'

describe Profile do

	let(:pf) {ProfileFactory.new}

	before :all do
		post '/profiles', {:profile => pf.valid, :auth => @af.valid}
		@pr = Profile.all.last
		j = JSON.parse(last_response.body)
		j['success'].should == true
		j['profile']['name'].should == pf.valid[:name]
	end

	describe 'creating' do
		context 'with valid data' do
			it 'creates a new profile' do
				# see the before all
			end
		end

		context 'without valid data' do
			it 'fails' do
				pf.bad_data.each do |d|
					post '/profiles', {:profile => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # describe creating

	describe 'indexing' do
		it 'returns all profiles' do
			get '/profiles', :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['profiles'].size.should == Profile.all.size
		end
	end # describe indexing

	describe 'viewing' do
		it 'returns a profile' do
			get "/profiles/#{@pr.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			j['profile']['name'].should == @pr.name
		end
	end # describe viewing

	describe 'updating' do
		context 'with valid data' do
			it 'updates the profile' do
				put "/profiles/#{@pr.short_id}", {:profile => {:name => 'new'}, :auth => @af.valid}
				j = JSON.parse(last_response.body)
				j['success'].should == true
				j['profile']['name'].should == 'new'
			end
		end

		context 'without valid data' do
			it 'fails (with non-unique name)' do
				pf.bad_data.each do |d|
					put "/profiles/#{@pr.short_id}", {:profile => d, :auth => @af.valid}
					j = JSON.parse(last_response.body)
					j['success'].should == false
					j['errors'].should_not be_empty
				end
			end
		end
	end # describe updating

	describe 'destroying' do
		it 'removes the profile from the db' do
			delete "/profiles/#{@pr.short_id}", :auth => @af.valid
			j = JSON.parse(last_response.body)
			j['success'].should == true
			Profile.all.should be_empty
		end
	end # describe destroying
end
