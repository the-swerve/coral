require 'mongo_mapper'
require 'state_machine'
require 'active_support/core_ext'

class Charge

	include MongoMapper::Document

	# Keys
	key :amount, Integer,
		:required => true
	key :name, String,
		:required => true
	key :due_date, Date,
		:required => true
	key :short_id, String
	key :state, String

	timestamps!

	validate  :due_date_in_future
	validates_numericality_of :amount, :greater_than => 0

	# Associations
	many :trnsactions
	belongs_to :subscription
	belongs_to :profile
	belongs_to :plan
	belongs_to :account

	# Callbacks
	before_validation :defaults, :on => :create

	state_machine :state, :initial => 'Unpaid' do

		event :pay do
			transition ['Unpaid','Overdue'] => 'Paid',
				:if => lambda {|c| c.due_date <= Date.today && c.trnsactions.create}
		end

		event :void do
			transition 'Paid' => 'Voided',
				:if => lambda {|c| c.trnsactions.create(:action => 'Void')}
		end

		event :past_due do
			transition 'Pending' => 'Overdue',
				:if => lambda {|c| c.due_date <= DateTime.now}
		end

	end

	def balance
		self.trnsactions.map(&:amount).sum || 0
	end

	def as_hash
		plan_hash = self.plan ? self.plan.as_hash : {}
		{:amount => self.amount.to_s,
		 :name => self.name,
		 :due_date => self.due_date.to_s,
		 :state => self.state,
		 :profile => self.profile.as_hash,
		 :transactions => self.trnsactions.map(&:as_hash),
		 :plan => plan_hash,
		 :id => self.id.to_s}
	end

	private

	# Validation
	def due_date_in_future
		if self.due_date < Date.today
			errors.add(:due_date, "date can't be in the past")
		end
	end

	# Callbacks
	def defaults
		self.name ||= "Charge (" + DateTime.now.to_s + ")"
		self.due_date ||= DateTime.now
		self.short_id = self.id
	end

end
