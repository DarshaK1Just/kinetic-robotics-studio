"""Run under the Python environment supplied with ROS 2 Jazzy."""
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
class StatusNode(Node):
    def __init__(self):
        super().__init__('labbook_status')
        self.pub=self.create_publisher(String,'/labbook/status',10)
        self.count=0; self.create_timer(0.5,self.publish_status)
    def publish_status(self):
        msg=String(); msg.data=f'bench_ready sequence={self.count}'
        self.pub.publish(msg); self.count+=1

def main():
    rclpy.init(); node=StatusNode()
    try: rclpy.spin(node)
    except KeyboardInterrupt: pass
    finally:
        node.destroy_node()
        if rclpy.ok(): rclpy.shutdown()
if __name__=='__main__': main()
