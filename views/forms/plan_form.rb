	<form method="post" class="form-inline" action="/plan/update" id="edit-plan-form">

		<label>Plan name: </label>
		<input type="text" id="edit-plan-name" name="name" /><br />
		<br />Charge
		<div class="input-prepend">
			<span class="add-on">$</span>
		</div>
			<input type="text" class="initial-plan-amount" name="amount" />
		<label>every</label>
		<input type="text" id="new-plan-cycle-amount" name="cycle" />
		<select id="new-plan-cycle-unit">
			<option value="day">Day(s)</option>
			<option value="day">Week(s)</option>
			<option value="day" selected="selected">Month(s)</option>
			<option value="day">Year(s)</option>
		</select>
		<br /><br />
		<p><a href="" id="more-options-button">more options <i class="icon-chevron-down"></i></a></p>
		<div id="more-plan-options">
			<p><label>Detailed Description</label><br />
				<textarea rows="3" cols="40" name="desc"></textarea>
			</p>
			<p>
				<label>Trial Period: </label>
				<input type="text" id="new-plan-cycle-amount" name="trial" />
				<select id="new-plan-cycle-unit">
					<option value="day">Day(s)</option>
					<option value="day">Week(s)</option>
					<option value="day">Month(s)</option>
					<option value="day">Year(s)</option>
				</select>
			</p>
				<label>Setup Fee: </label>
				<div class="input-prepend">
					<span class="add-on">$</span>
					<input type="text" class="initial-plan-amount" name="trial" placeholder="amount" />
				</div>
		</div>


		<br />
		<input class="btn" id="initial-plan-submit" name="commit" type="submit" value="Create Plan" />
	</form>
