import {Logger, MainInstance, Publisher, InputPublisherModel as PublisherModel, PublisherProtocol} from 'enqueuer';

const Stomp = require('stomp-client');

export class StompPublisher extends Publisher {

    public constructor(publisherProperties: PublisherModel) {
        super(publisherProperties);
    }

    public publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            const client = new Stomp(this.address, this.port, this.user, this.password);
            client.connect(async (sessionId: string) => {
                Logger.debug(`Stomp publisher connected id ${sessionId}`);
                this.executeHookEvent('onPublished', {sessionId});
                await client.publish(this.queue, this.payload);
                resolve();
            }, (err: any) => {
                Logger.error(`Error connecting to stomp to publish: ${err}`);
                reject(err);
            });
        });
    }

}

export function entryPoint(mainInstance: MainInstance): void {
    const stomp = new PublisherProtocol('stomp',
        (publisherModel: PublisherModel) => new StompPublisher(publisherModel), {
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
                    payload: {
                        type: 'any',
                        required: true
                    },
                },
                hooks: {
                    onPublished: {
                        arguments: {
                            sessionId: {}
                        }
                    }
                }
            }
        })
        .setLibrary('stomp-client');
    mainInstance.protocolManager.addProtocol(stomp);
}
