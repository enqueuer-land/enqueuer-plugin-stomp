import {Logger, MainInstance, Publisher, PublisherModel, PublisherProtocol} from 'enqueuer-plugins-template';

const Stomp = require('stomp-client');

export class StompPublisher extends Publisher {

    public constructor(publisherProperties: PublisherModel) {
        super(publisherProperties);
    }

    public publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            const client = new Stomp(this.address, this.port, this.user, this.password);
            client.connect((sessionId: string) => {
                Logger.debug(`Stomp publisher connected id ${sessionId}`);
                client.publish(this.queue, this.payload);
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
        (publisherModel: PublisherModel) => new StompPublisher(publisherModel))
        .setLibrary('stomp-client');
    mainInstance.protocolManager.addProtocol(stomp);
}
