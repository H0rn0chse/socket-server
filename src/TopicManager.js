import { send } from "../index.js";

/**
 * A platform unspecific manager for topics which allows subscribing
 * and publishing to a topic
 */
export class TopicManager {
    constructor () {
        this.topics = new Map();
        this.users = new Map();
    }

    /**
     * Subscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    subscribe (ws, topic) {
        let topicUsers = this.topics.get(topic);
        if (topicUsers === undefined) {
            topicUsers = new Map();
            this.topics.set(topic, topicUsers);
        }
        topicUsers.set(ws.id, ws);

        let userTopics = this.users.get(ws.id);
        if (userTopics === undefined) {
            userTopics = new Map();
            this.users.set(ws.id, userTopics);
        }
        userTopics.set(topic, topicUsers);
    }

    /**
     * Unsubscribes a WebSocket to a topic
     * @param {WebSocket} ws
     * @param {string} topic
     */
    unsubscribe (ws, topic) {
        const userTopics = this.users.get(ws.id);
        if (userTopics) {
            const topicUsers = userTopics.get(topic);
            topicUsers.delete(ws.id);
            userTopics.delete(topic);
        }
    }

    /**
     * Unsubscribes a WebSocket from all topics
     * @param {WebSocket} ws
     */
    unsubscribeAll (ws) {
        const userTopics = this.users.get(ws.id);
        if (userTopics) {
            userTopics.forEach((topicUsers, topic) => {
                topicUsers.delete(ws.id);
            });
            this.users.delete(ws.id);
        }
    }

    /**
     * Publishes a message to all websockets subscribed to a message
     * @param {string} topic
     * @param {string} channel
     * @param {object} data
     */
    publish (topic, channel, data) {
        const topicUsers = this.topics.get(topic);
        if (topicUsers) {
            topicUsers.forEach((ws, id) => {
                send(ws, channel, data);
            });
        }
    }
}
