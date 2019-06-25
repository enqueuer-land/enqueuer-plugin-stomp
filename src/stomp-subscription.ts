import {Logger, MainInstance, Subscription, InputSubscriptionModel as SubscriptionModel, SubscriptionProtocol} from 'enqueuer';

const Stomp = require('stomp-client');

export class StompSubscription extends Subscription {
    private client: any;

    constructor(subscriptionModel: SubscriptionModel) {
        super(subscriptionModel);
    }

    public receiveMessage(): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.trace(`Stomp waiting for a message related to queue ${this.queue}`);
            this.client.subscribe(this.queue, (message: string, headers: {}) => {
                Logger.trace(`Stomp message received header ${JSON.stringify(headers)}`);
                this.executeHookEvent('onMessageReceived', {payload: message, headers: headers});
                resolve();
            });
            this.client.once('error', (err: any) => {
                reject(err);
            });
        });
    }

    public subscribe(): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.debug(`Stomp subscription connecting to ${this.address}:${this.port}`);
            this.client = new Stomp(this.address, this.port, this.user, this.password);
            this.client.connect((sessionId: string) => {
                Logger.debug(`Stomp subscription connected id ${sessionId}`);
                this.executeHookEvent('onSubscribed', {sessionId});
                resolve();
            }, (err: any) => {
                reject(err);
            });
        });
    }

    public async unsubscribe(): Promise<void> {
        this.client.unsubscribe(this.queue);
    }

}

export function entryPoint(mainInstance: MainInstance): void {
    const stomp = new SubscriptionProtocol('stomp',
        (subscriptionModel: SubscriptionModel) => new StompSubscription(subscriptionModel),
        {
            homepage: 'https://github.com/enqueuer-land/enqueuer-plugin-stomp',
            description: 'Enqueuer plugin to handle stomp messages',
            libraryHomepage: 'https://www.npmjs.com/package/stomp-client',
            schema: {
                attributes: {
                    address: {
                        type: 'string',
                        required: true
                    },
                    port: {
                        type: 'number',
                        required: true
                    },
                    user: {
                        type: 'string',
                        required: true
                    },
                    password: {
                        type: 'string',
                        required: true
                    },
                    queue: {
                        type: 'string',
                        required: true
                    },
                },
                hooks: {
                    onSubscribed: {
                        arguments: {
                            sessionId: {}
                        }
                    },
                    onMessageReceived: {
                        arguments: {
                            headers: {},
                            payload: {}
                        }
                    }
                }
            }
        })
        .setLibrary('stomp-client');
    mainInstance.protocolManager.addProtocol(stomp);
}
