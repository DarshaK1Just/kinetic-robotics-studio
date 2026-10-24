"""Tests for calculations and command expiry, not physical safety certification."""
import importlib.util,sys,unittest
from pathlib import Path
D=Path(__file__).parent

def load(name,filename):
    spec=importlib.util.spec_from_file_location(name,D/filename)
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module);return module
m=load('control_math','10_control_math.py'); q=load('grid_learning','16_grid_learning.py')
class Tests(unittest.TestCase):
    def test_led(self): self.assertAlmostEqual(m.led_resistance(3.3,2.0,0.005),260)
    def test_led_invalid(self):
        with self.assertRaises(ValueError):m.led_resistance(2,3,0.01)
    def test_wheels_straight(self): self.assertEqual(m.wheel_speeds(0.2,0,0.04,0.16),(5.0,5.0))
    def test_wheels_turn(self):
        l,r=m.wheel_speeds(0,1,0.04,0.16);self.assertAlmostEqual(l,-2);self.assertAlmostEqual(r,2)
    def test_arm(self):
        x,y=m.forward_2link(0.1,0.1,0,0);self.assertAlmostEqual(x,0.2);self.assertAlmostEqual(y,0)
    def test_stop(self): self.assertAlmostEqual(m.stopping_distance(0.3,0.2,0.5),0.15)
    def test_pid_limits(self):
        c=m.PID();self.assertLessEqual(abs(c.update(100,0,0.01)),c.limit)
    def test_pid_converges(self): self.assertLess(abs(m.response()[-1][1]-1.0),0.05)
    def test_grid(self):
        agent,_=q.train(seed=7);route,ok=q.evaluate(agent);self.assertTrue(ok);self.assertLessEqual(len(route),11)
    def test_command_age(self):
        valid=lambda age_ms:0<=age_ms<250
        self.assertTrue(valid(249));self.assertFalse(valid(250));self.assertFalse(valid(-1))
if __name__=='__main__':unittest.main(verbosity=2)
