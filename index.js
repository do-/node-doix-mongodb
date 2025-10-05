const {Tracker} = require ('events-to-winston')
const {ResourcePool} = require ('doix')
const {MongoClient}  = require ('mongodb')

const conn2logId = new Map ()
const NO_DETAILS = {}

class Wrapper {

	constructor (raw) {

		this.raw = raw

	}

	setupLogId () {

		const {job, pool} = this

		pool.parentLogId = job.tracker.id

	}

	async ping () {

		return this.raw.client.db ('admin').command ({ping: 1})

	}

	async find (c, o) {

		this.setupLogId ()

		return this.raw.collection (c).find (o)

	}

	async insertMany (c, a) {

		if (a.length === 0) return

		this.setupLogId ()

		return this.raw.collection (c).insertMany (a)

	}

	async bulkWrite (c, a, o = {}) {

		if (a.length === 0) return

		if (this.pool.majorVersion >= 8) {

			this.setupLogId ()

			return this.raw.collection (c).bulkWrite (a, {ordered: false, ...o})

		}
		else {

			const todo = []; for (const i of a) for (const k in i) if (k === 'updateOne') {

				const {filter, update, upsert} = i [k]

				todo.push (this.updateOne (c, filter, update, {upsert}))

			}

			await Promise.all (todo)

		}

	}

	async updateOne (c, x, y, z) {

		this.setupLogId ()

		return this.raw.collection (c).updateOne (x, y, z)

	}

	async release () {

		// do nothing

	}

}

module.exports = class extends ResourcePool {

	addLogId (connectionId, requestId) {

		const id = `${this.parentLogId}/${this.name}/${connectionId}/${requestId}`

		conn2logId.set (connectionId, id)

		return id

	}

	delLogId (connectionId) {

		const id = conn2logId.get (connectionId)

		conn2logId.delete (connectionId)

		return id

	}

	constructor (options) {

		super (options)

		this.dbName = options.dbName

		this.wrapper = Wrapper
		this.client = new MongoClient (options.url, {monitorCommands:true})

		this.client.on ('commandStarted', e => {			

			const {commandName, command, connectionId, requestId} = e

			const info = {
				isFirst: true,
				level: 'info',
				event: 'start',
				id: this.addLogId (connectionId, requestId),
				details:
					commandName === 'find'   ? command.filter :
					commandName === 'update' ? command.updates :
					commandName === 'insert' ? command.documents :
					NO_DETAILS
			}

			info.message = info.details === NO_DETAILS ? commandName : `${commandName} ${command[commandName]}`

			this.logger.log (info)

		})

		this.client.on ('commandSucceeded', ({duration, connectionId}) => this.logger.log ({
			isLast: true,
			level: 'info',
			event: 'finish',
			message: 'finish',
			elapsed: duration,
			id: this.delLogId (connectionId),
		}))

		this.client.on ('commandFailed', ({failure, duration, connectionId}) => {

			const id = this.delLogId (connectionId)

			this.logger.log ({
				level: 'info',
				event: 'error',
				message: String (failure),
				id
			})

			this.logger.log ({
				isLast: true,
				level: 'info',
				event: 'finish',
				message: 'finish',
				elapsed: duration,
				id
			})

		})

	}

	async getServerInfo () {

		this.parentLogId = this.app [Tracker.LOGGING_ID]

		return this.db.admin ().serverInfo ()

	}

	async getMajorVersion () {

		const {version} = await this.getServerInfo ()

		return parseInt (version.substring (0, version.indexOf ('.')))
		
	}

	async getConnection () {

		const {client} = this

		await client.connect ()

		return client.db (this.dbName)
		
	}

	async acquire () {

		if (!this.db) this.db = await this.getConnection ()

		if (!this.majorVersion) this.majorVersion = await this.getMajorVersion ()

		return this.db

	}

}